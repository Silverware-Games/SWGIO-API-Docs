let API_VERSION = "2.3";
let API_OK = false;
let GAME_ID = "4";
let API_KEY = "";
let SWGIO_USERNAME = "";


let DEFAULT_MSG_TIME = 6;

let url = new URL('https://silverwaregames.io/api.php');
url.searchParams.append('v', API_VERSION);
url.searchParams.append('act', 'get.status' );

fetch(url)
    .then(response => {
        if(!response.ok) {
            throw Error(response.statusText);
        }
        API_OK = true;
        AddUIMessage("API: " + API_VERSION + " IS CONNECTED.");
        return response.json();
    })
    .then(data => {
        console.log('Data:', data);
    })
    .catch(error => {
        console.log('Error:', error);
        AddUIMessage("API NOT CONNECTED: " + error);

    });


class UIMessage
{
    constructor(msg) {
        this.msg = msg;
        this.visTime = DEFAULT_MSG_TIME;
    }

    update()
    {
        this.visTime -= deltaT;
        if(this.visTime <= 0) {
            return false;
        }

        return true;
    }

    draw(position)
    {
        let xAdd = 0;
        if(this.visTime > DEFAULT_MSG_TIME - .5)
        {
            xAdd = drawWidth * (this.visTime - (DEFAULT_MSG_TIME - .5))/.5;
        }
        if(this.visTime < .5)
        {
            xAdd = -drawWidth * (1-(this.visTime/.5));
        }

        x.beginPath();
        x.arc(xAdd + 100, drawHeight - 100 - position*60, 55/2, Math.PI * .5, Math.PI * 1.5);
        x.arc(xAdd + drawWidth - 100, drawHeight - 100 - position*60, 55/2, Math.PI * 1.5, Math.PI * .5);
        x.closePath();

        x.fillStyle = "#276cbb";
        //x.stroke();

        x.fill();


        text(this.msg, xAdd +drawWidth/2, drawHeight - 100 - position*60, 40 );
    }
}

let UIMessages = new Array();

function AddUIMessage(txt)
{
    UIMessages.push(new UIMessage(txt));
}

let SCORE_HASH = "";
let SCORE_VALUE = 0;
function SubmitHighScore(value)
{
    if(API_OK && API_KEY != "" && API_KEY != "LOADING")
    {
        SCORE_VALUE = value;
        SCORE_HASH = "";

        url = new URL('https://silverwaregames.io/api.php');
        url.searchParams.append('v', API_VERSION);
        url.searchParams.append('act', 'get.game.hash' );
        url.searchParams.append('game', GAME_ID );
        url.searchParams.append('type', '0' );
        url.searchParams.append('key', API_KEY );
        url.searchParams.append('data', value);

        fetch(url)
            .then(response => {
                if(!response.ok) {
                    throw Error(response.statusText);
                }
                return response.json();
            })
            .then(data => {
                SCORE_HASH = data.message;
                let formData = new FormData();
                formData.append('v', API_VERSION);
                formData.append('game', GAME_ID);
                formData.append('act', 'post.game.data' );
                formData.append('type', '0' );
                formData.append('key', API_KEY );
                formData.append('data', value);
                formData.append('hash', SCORE_HASH);

                fetch('https://silverwaregames.io/api.php',
                    { method: 'POST',
                          body: formData})
                    .then(response => {
                        if(!response.ok) {
                            throw Error(response.statusText);
                        }
                        if(ValidUsername())
                        {
                            AddUIMessage("Congratulations " + SWGIO_USERNAME);
                        }
                        AddUIMessage("Your Score " + value + " is Posted to SWGIO!");
                        return response.json();
                    })
                    .catch(error => {
                        AddUIMessage("Err Posting Score: " + error);
                    });
                //AddUIMessage("Got Key: " + API_KEY);

            })
            .catch(error => {
                AddUIMessage("Err Score Hash: " + error);
            });
    }
}


function ValidUsername()
{
    if(SWGIO_USERNAME == "")
    {
        return false;
    }

    if(SWGIO_USERNAME == "Error")
    {
        return false;
    }

    return true;
}

// Call this in the game loop every frame.
function updateAPIOverlays()
{
    if(API_OK && API_KEY == "")
    {
        API_KEY = "LOADING";

        url = new URL('https://silverwaregames.io/api.php');;
        url.searchParams.append('v', API_VERSION);
        url.searchParams.append('game', GAME_ID);
        url.searchParams.append('act', 'get.key.auto' );

        fetch(url)
            .then(response => {
                if(!response.ok) {
                    throw Error(response.statusText);
                }

                return response.json();
            })
            .then(data => {
                API_KEY = data.message[1].trim();
                AddUIMessage("You are logged in to SWGIO!");
                //AddUIMessage("Got Key: " + API_KEY);

            })
            .catch(error => {
                AddUIMessage("Not Logged In: " + error);
            });
    }

    if(API_OK && API_KEY != "" && API_KEY != "LOADING" && SWGIO_USERNAME == "")
    {
        SWGIO_USERNAME = "Error";
        url = new URL('https://silverwaregames.io/api.php');;
        url.searchParams.append('v', API_VERSION);
        url.searchParams.append('game', GAME_ID);
        url.searchParams.append('act','get.user.data' );
        url.searchParams.append('type','1' );
        url.searchParams.append('key', API_KEY );

        fetch(url)
            .then(response => {
                if(!response.ok) {
                    throw Error(response.statusText);
                }

                return response.json();
            })
            .then(data => {
                SWGIO_USERNAME = data.message.trim();
                AddUIMessage("Welcome " + SWGIO_USERNAME + "!");
                //AddUIMessage("Got Key: " + API_KEY);

            })
            .catch(error => {
                AddUIMessage("No User Data: " + error);
            });
    }

    for(let i = 0; i < UIMessages.length; i++)
    {
        if(!UIMessages[i].update())
        {
            delete(UIMessages[i]);
            UIMessages.splice(i,1);
            i--;
        }
    }
}

// Call this after drawing the rest of the game to overlay the API info.
function drawAPIOverlays()
{
    for(let i = 0; i < UIMessages.length; i++) {
        UIMessages[i].draw(i);
    }
}