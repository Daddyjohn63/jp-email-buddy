**SETUP THE CHAT PAGE**

**SETUP SENDMESSAGE ENDPOINT**

-create a folder called chat in the api.
-create a file called sendMessage.js
this file now creates a new api endpoint called localhost:3000/api/chat/sendmessage

```js
import { OpenAIEdgeStream } from "openai-edge-stream";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  //the req object can now grab/ receive any information that we send it.
  try {
    const {} = await req.json();
  } catch (error) {
    console.log("AN ERROR OCCURRED IN SEND MESSAGE:", e);
  }
}
```

**CONNECTING TO OPENAI**
https://platform.openai.com/docs/api-reference/chat/create

EXAMPLE REQUEST

```js
import OpenAI from "openai";

const openai = new OpenAI();

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "gpt-3.5-turbo",
  });

  console.log(completion.choices[0]);
}

main();
```

RESPONSE

```js
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-3.5-turbo-0613",
  "system_fingerprint": "fp_44709d6fcb",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "\n\nHello there, how may I assist you today?",
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}

```

**BASIC FUNCTION TO CONNECT TO OPENAI AND STREAM TO CONSOLE AND PAGE**

```js
//sendmessage endpoint
import { OpenAIEdgeStream } from "openai-edge-stream";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { message } = await req.json();
    const stream = await OpenAIEdgeStream(
      "https://api.openai.com/v1/chat/completions",
      {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ content: message, role: "user" }],
          stream: true,
        }),
      }
    );
    return new Response(stream);
  } catch (e) {
    console.log("AN ERROR OCCURRED IN SEND MESSAGE:", e);
  }
}
```

**SUBMIT HANDLER**
IN CHATID PAGE WE NEED TO CREATE OUR SUBMIT HANDLER AND HOOK IT UP TO OUR SENDMESSAGE ENDPOINT

```js
import { ChatSidebar } from "components/chatSidebar";
import Head from "next/head";
import { useState } from "react";
import { streamReader } from "openai-edge-stream";

export default function ChatPage() {
  const [messageText, setMessageText] = useState("");
  const [incomingMessage, setIncomingMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("MESSAGETEXT:", messageText);
    //hit send message endpoint
    const response = await fetch(`/api/chat/sendMessage`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: messageText }),
    });
    const data = response.body;
    if (!data) {
      return;
    }
    const reader = data.getReader();
    await streamReader(reader, (message) => {
      console.log("MESSAGE: ", message);
      setIncomingMessage((s) => `${s}${message.content}`);
    });
  };

  return (
    <div>
      <Head>
        <title>New Email</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr]">
        <ChatSidebar />
        <div className="flex flex-col overflow-hidden bg-gray-700">
          <div className="flex-1 text-white">{incomingMessage}</div>
          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset className="flex gap-2">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Send a message..."
                  className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                />
                <button type="submit" className="btn">
                  Send
                </button>
              </fieldset>
            </form>
          </footer>
        </div>
      </div>
    </div>
  );
}
```

Lord of the Rings
Fantasy, adventure
J.R Tolkein
Leather with gold leaf edges

**CREATE A MESSAGE COMPONENT TO USE FOR USER AND ASSISTANT**
we need to set a state value which takes the user message and creates an array that takes a new object we create. \_id, role and message
