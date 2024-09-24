//send messages to openai and then to the chat.
import { OpenAIEdgeStream } from "openai-edge-stream";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    //need chatId to determine if we are creating a new chat or adding to an existing chat.
    const { chatId: chatIdFromParam, message, title } = await req.json();
    //throw new Error("Test 500 Error");
    //validate message data
    if (!message || typeof message !== "string" || message.length > 1000) {
      return new Response(
        {
          message: "message is required and must be less than 1000 characters",
        },
        {
          status: 422,
        }
      );
    }
    let chatId = chatIdFromParam;
    //console.log("MESSAGE: ", message);
    const initialChatMessage = {
      role: "system",
      content:
        "Your name is email buddy and you write marketing emails for a company that re-publishes and sells existing books and  transforms them with a new book binding and illustrations. It is an internationally well known quality product.You were created by John Paul. Your response must be formatted as markdown.",
    };

    let newChatId;
    let chatMessages = [];

    if (chatId) {
      //add message to chat
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/addMessageToChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            chatId,
            role: "user",
            content: message,
          }),
        }
      );
      const json = await response.json();
      chatMessages = json.chat.messages || [];
    } else {
      //create new chat
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/createNewChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            message,
            title,
          }),
        }
      );
      const json = await response.json();
      chatId = json._id;
      newChatId = json._id;
      chatMessages = json.messages || [];
    }

    const messagesToInclude = [];
    chatMessages.reverse();
    let usedTokens = 0;
    for (let chatMessage of chatMessages) {
      const messageTokens = chatMessage.content.length / 4;
      usedTokens = usedTokens + messageTokens;
      if (usedTokens <= 2000) {
        messagesToInclude.push(chatMessage);
      } else {
        break;
      }
    }

    messagesToInclude.reverse();

    const stream = await OpenAIEdgeStream(
      "https://api.openai.com/v1/chat/completions",
      {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({
          //model: "gpt-3.5-turbo",
          model: "gpt-4o-mini",
          messages: [initialChatMessage, ...messagesToInclude],
          stream: true,
        }),
      },
      {
        onBeforeStream: ({ emit }) => {
          //creates a new chat id only if we do not have an existing chat.
          if (newChatId) {
            emit(newChatId, "newChatId");
          }
        },
        onAfterStream: async ({ fullContent }) => {
          console.log(
            "Sending payload to addMessageToChat:",
            JSON.stringify({
              chatId,
              role: "assistant",
              content: fullContent,
            })
          );

          await fetch(
            `${req.headers.get("origin")}/api/chat/addMessageToChat`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                cookie: req.headers.get("cookie"),
              },
              body: JSON.stringify({
                chatId,
                role: "assistant",
                content: fullContent,
              }),
            }
          );
        },
      }
    );
    return new Response(stream);
  } catch (e) {
    console.log("an error has occurred:", e);
    return new Response(
      { message: "An error occurred in sendMessage" },
      {
        status: 500,
      }
    );
  }
}
