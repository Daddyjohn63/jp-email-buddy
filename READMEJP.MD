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

**_ BASIC FUNCTION TO CONNECT TO OPENAI_**

```js
export default async function handler(req) {

  try {
    const {}= await req.json();
    const stream = await OpenAIEdgeStream(
      "https://api.openai.com/v1/chat/completions"{
        headers:{
          'content-type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method:"POST",
        body: JSON.stringify({
          model:"gpt-3.5-turbo",
          messages: [{content: message, role:"user"}],
          stream: true
        })
      }
    );
    return new Response(stream);
  } catch (error) {
    console.log("AN ERROR OCCURRED IN SEND MESSAGE:", e);
  }

}
```

**_SUBMIT HANDLER_**
IN CHATID PAGE WE NEED TO CREATE OUR SUBMIT HANDLER AND HOOK IT UP TO OUR SENDMESSAGE ENDPOINT
