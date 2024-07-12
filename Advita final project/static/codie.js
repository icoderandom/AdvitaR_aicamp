import { contentFilterText, stopAtLastPeriod, removeBlankLines, toBase64, uploadFile } from "./content-filter.js";
import { elevenlabs_api_key, hugging_face_key } from "./keys.js";
import { HfInference } from "@huggingface/inference";

const micButton = document.querySelector('.mic-btn');
const entry = document.querySelector(".image-gen-entry");
const frame = document.querySelector('.text-frame');
const submitButton = document.querySelector('.submit-btn');
const downloadButton = document.querySelector('.download-btn');
const downloadableLink = document.querySelector('.download-link');
const codieIntroTag = document.createElement('div');
const codieInstructionTag = document.createElement('div');
const fileReader = new FileReader();
const imgPromtString = [
    'picture', 'image', 'show me', 'photo'
]
const records = [];
let mediaRecorder;
codieStart();

function addBubbleEvent(bubble){
    bubble.addEventListener('click', () => {
        const options = {
                method: "POST",
                headers: {
                    'xi-api-key':elevenlabs_api_key,
                    'Content-Type': 'application/json'
                },
                body: `{"text":"${bubble.innerHTML.trim()}"}`,
                type: "arrayBuffer"
        }
        fetch("https://api.elevenlabs.io/v1/text-to-speech/OYTbf65OHHFELVut7v2H", options)
            .then(async (response) => {
                const arrayBuffer = await response.arrayBuffer();
                const blob = new Blob([arrayBuffer], {type: 'audio/wav'});
                const audioUrl = URL.createObjectURL(blob);
                const audioElement = new Audio(audioUrl);
                audioElement.play();

            })
    })
}

async function audioToText(filename) {
    fileReader.readAsArrayBuffer(filename)
    const data = filename
	const response = await fetch(
		"https://api-inference.huggingface.co/models/openai/whisper-large-v3",
		{
			headers: {
				Authorization: `Bearer ${hugging_face_key}`,
				"Content-Type": "application/json",
			},
			method: "POST",
			body: data,
		}
	);
	const result = await response.json();
	return result;
}

fileReader.onload = function (event) {
    const arrayBuffer = event.target.result;
};

async function textGen(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/google/gemma-1.1-7b-it",
		{
			headers: {
				Authorization: `Bearer ${hugging_face_key}`,
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

async function imageGen(data) {
    /***********************************
     * 
     * 
     * 
     * 
     * 
     * 
     * 
     * 
     * 
     * 
     **********************************/
}

navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    mediaRecorder = new MediaRecorder(stream);
    let chunks = [];
    mediaRecorder.ondataavailable = function (event) {
        chunks = [];
        chunks.push(event.data);
    };
    mediaRecorder.onstop = function () {
        micButton.disabled = true;
        const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
        audioToText(blob).then(async (response) => {
            const userAudio = response.text.toLowerCase();
            mainCall(userAudio);
        });
    };
}).catch(function (err) {
    console.error('Error accessing microphone:', err);
});

micButton.addEventListener('click', () => {
    const icon = micButton.childNodes[0].nodeName.toLowerCase();
    if (icon === 'i') {
        const soundIcon = document.createElement('img');
        soundIcon.src = "../../static/asset/sound.gif";
        soundIcon.classList.add('sound-waves');
        micButton.removeChild(micButton.childNodes[0]);
        micButton.appendChild(soundIcon);
        mediaRecorder.start();
    } else {
        const micIcon = document.createElement('i');
        micIcon.classList.add('fa-solid', 'fa-microphone');
        micButton.removeChild(micButton.childNodes[0]);
        micButton.appendChild(micIcon);
        mediaRecorder.stop();
    }
})

downloadButton.addEventListener('click', () => {
    const filename = "records.txt";
    let conversation = "";
    if (records.length > 0) {
        records.forEach(record => {
            conversation += record + '\n' + '\n';
        });

        const blob = new Blob([conversation], {
            type: 'text/plain;charset=utf-8'
        });
        downloadableLink.download = filename;
        downloadableLink.href = window.URL.createObjectURL(blob);
    }
})

submitButton.addEventListener('click', () => {
    submitEntry();
    submitButton.disabled = true; 
})

async function submitEntry() {
    const input = entry.value.toLowerCase().trim();
    mainCall(input);
}

async function mainCall(userValue) {
    const userInput = document.createElement('div');
    userInput.classList.add("user-bubble");
    const aiOutput = document.createElement('div');
    aiOutput.classList.add("ai-bubble");
    if (userValue != "") {
        let contentValue = await contentFilterText(userValue);
        if (contentValue == 1) {
            if (checkImgPromt(userValue)) {
                userInput.innerHTML = userValue;
                aiOutput.innerHTML = "Loading...";
                frame.appendChild(userInput);
                frame.appendChild(aiOutput);
                const imgCon = document.createElement('div');
                const img = document.createElement('img');
                /***************************************
                 * 
                 * 
                 * 
                 * 
                 * 
                 * 
                 * 
                 * 
                 * 
                 * 
                 * 
                 ***************************************/
            } else {
                textGen({"inputs":userValue, "parameters": {"return_full_text":false} })
                .then(async (response) => {
                    let aiContentValue = await contentFilterText(response[0].generated_text)
                    if(aiContentValue == 1){
                        frame.appendChild(userInput)
                        frame.appendChild(aiOutput)
                        userInput.innerHTML = userValue
                        let cutOff = stopAtLastPeriod(resposne[0].generated_text)
                        let noBlankLines = removeBlankLines(cutOff)
                        aiOutput.innerHTML = noBlankLines
                        
                        aiOutput.classList.add("custom_cursor")
                        addBubbleEvent(aiOutput)

                        frame.scrollTop = frame.scrollHeight
                        resetPlaceholder()
                        records.push("User: " + userInput.innerHTML)
                        records.push("AI: " + noBlankLines)

                        submitButton.disabled = false;
                        micButton.disabled = false;


                    } else {
                        setPlaceholder(aiContentValue);
                        submitButton.disabled = false;
                        micButton.disabled = false;
                    }
                })


            }
        } else {
            setPlaceholder(contentValue);
        }
    }
}

function codieStart() {
    const codieIntro = "Hello, my name is Codie. How can I assist you?";
    const codieInstruction = "Start your sentence with 'generate me an image' or anything to just chat with me!";
    codieIntroTag.classList.add('ai-bubble');
    codieInstructionTag.classList.add('ai-bubble');
    codieIntroTag.textContent = codieIntro;
    codieInstructionTag.textContent = codieInstruction;
    codieIntroTag.classList.add("custom-cursor");
    codieInstructionTag.classList.add("custom-cursor");
    addBubbleEvent(codieIntroTag);
    addBubbleEvent(codieInstructionTag); 
    frame.appendChild(codieIntroTag);
    frame.appendChild(codieInstructionTag);
    records.push("AI: " + codieIntro);
    records.push("AI: " + codieInstruction);
}

function setPlaceholder(cv) {
    if (cv == 0) {
        entry.value = "";
        entry.placeholder = "Please be appropriate!";
    } else {
        entry.value = "";
        entry.placeholder = "There has been an error.";
    }
}

function resetPlaceholder() {
    entry.value = '';
    entry.placeholder = "Chat with Codie or ask him to generate an image";
}

function checkImgPromt(input) {
    for (let i = 0; i < imgPromtString.length; i++) {
        if (input.includes(imgPromtString[i])) {
            return true;
        }
    }
    return false;
}