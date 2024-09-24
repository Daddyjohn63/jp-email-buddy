import { faEnvelopeOpen, faRobot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChatSidebar } from "components/chatSidebar";
import Head from "next/head";
import { useEffect, useState } from "react";
import { streamReader } from "openai-edge-stream";
import { v4 as uuid } from "uuid";
import { Message } from "components/Message";
import { useRouter } from "next/router";
import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default function ChatPage({ chatId, title, messages = [] }) {
  //console.log("props:", chatId, title, messages); //title not showing
  // const [messageText, setMessageText] = useState("");
  const [incomingMessage, setIncomingMessage] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [keyWords, setKeyWords] = useState("");
  const [author, setAuthor] = useState("");
  const [bookBinding, setBookBinding] = useState("");
  const [addInformation, setAddInformation] = useState("");
  const [bookIllustrator, setBookIllustrator] = useState("");
  const [introductionBy, setIntroductionBy] = useState("");
  const [voiceTone, setVoiceTone] = useState("");
  const [numberofWords, setNumberofWords] = useState(50);
  const [newChatMessages, setNewChatMessages] = useState([]);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [newChatId, setNewChatId] = useState(null);
  const [fullMessage, setFullMessage] = useState("");
  const [originalChatId, setOriginalChatId] = useState(chatId);
  const [networkError, setNetworkError] = useState("");

  //create message conditional on which fields are entered.
  let messageText = "";

  if (bookTitle) {
    messageText += `Write me a marketing email about a book called ${bookTitle}. `;
  }

  if (author) {
    messageText += `By the author ${author}. `;
  }

  if (introductionBy) {
    messageText += `It is introduced by ${introductionBy}. `;
  }

  if (bookBinding) {
    messageText += `The book binding is ${bookBinding}. `;
  }

  if (bookIllustrator) {
    messageText += `The illustrations by ${bookIllustrator}. `;
  }

  if (keyWords) {
    messageText += `Use the comma-separated keywords of ${keyWords}. `;
  }

  if (addInformation) {
    messageText += `Take into account ${addInformation}. `;
  }

  if (numberofWords) {
    messageText += `Only write ${numberofWords} words. `;
  }

  if (voiceTone) {
    messageText += `Use a ${voiceTone} tone of voice . `;
  }

  // Add the common part
  messageText += "Add the subject title in h2 markup.";

  // const messageText = `Write me a marketing email about a book called ${bookTitle}. By the author ${author}. It is introduced by ${introductionBy}. The book binding is ${bookBinding}. The illustrations by ${bookIllustrator}.Use the comma separated keywords of ${keyWords}. Take into account ${addInformation}. Only write ${numberofWords} words. Use the following tone of voice ${voiceTone}. Add the subject title in h2 markup`;

  const messageTitle = `${campaignName}`;
  const router = useRouter();
  const routeHasChanged = chatId !== originalChatId;

  const { newCampaign } = router.query;

  useEffect(() => {
    if (newCampaign) {
      // Change state or perform actions based on the newCampaign parameter
      setIsSubmitted(false);
    } else {
      setIsSubmitted(true);
    }
  }, [newCampaign]);

  //when our route changes / reset if the chatId changes
  useEffect(() => {
    setNewChatMessages([]);
    setNewChatId(null);
  }, [chatId]);

  // save the newly streamed message to new chat messages
  useEffect(() => {
    if (!routeHasChanged && !generatingResponse && fullMessage) {
      setNewChatMessages((prev) => [
        ...prev,
        {
          _id: uuid(),
          role: "assistant",
          content: fullMessage,
        },
      ]);
      setFullMessage("");
    }
  }, [generatingResponse, fullMessage, routeHasChanged]);

  // if we've created a new chat
  useEffect(() => {
    if (!generatingResponse && newChatId) {
      setNewChatId(null);
      router.push(`/chat/${newChatId}`);
    }
  }, [newChatId, generatingResponse, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneratingResponse(true);
    setOriginalChatId(chatId);
    setNewChatMessages((prev) => {
      const newChatMessages = [
        ...prev,
        {
          _id: uuid(),
          role: "user",
          content: messageText,
          title: messageTitle,
        },
      ];
      return newChatMessages;
    });
    setCampaignName("");
    setBookTitle("");
    setKeyWords("");
    setAuthor("");
    setBookBinding("");
    setAddInformation("");
    setBookIllustrator("");
    setIntroductionBy("");
    setVoiceTone("");
    setNumberofWords(50);

    //console.log("NEW CHAT:", json);
    // console.log("MESSAGETEXT:", messageText);
    //hit send message endpoint

    //check what we are sending to sendMessage
    console.log(
      "Sending payload:",
      JSON.stringify({ message: messageText, title: messageTitle })
    ); //this confirms that we are getting the title back from the sendMessage endpoint. SO HOW TO PERSIST THIS TO THE PAGE?

    const response = await fetch(`/api/chat/sendMessage`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chatId,
        message: messageText,
        title: messageTitle,
      }),
    });

    if (!response.ok) {
      // Handle the case where there was an error in the API response
      setNetworkError(
        "Oops! It looks like there was an issue with the request to OpenAI. Please check back later."
      );
      return;
    }

    //get the reader so we can read the response coming back from the sendMessage endpoint.
    const data = await response.body;
    if (!data) {
      setNetworkError(
        "Oops! It looks like OpenAI is having issues at the moment, please check back later"
      );
      return;
    }

    const reader = data.getReader();
    let content = "";
    await streamReader(reader, (message) => {
      //console.log("TITLE: ", title); //title coming back as undefined
      // console.log("MESSAGE: ", message);

      if (message.event === "newChatId") {
        setNewChatId(message.content);
      } else {
        setIncomingMessage((s) => `${s}${message.content}`);
        content = content + message.content;
      }
    });
    setFullMessage(content);
    setIncomingMessage("");
    setGeneratingResponse(false);
    setIsSubmitted(true);
    // setNetworkError("");
  };

  //messages are from the props passed in from the server side props fn below. newChatMessages are the new message that has just come in from chat gpt
  const allMessages = [...messages, ...newChatMessages];

  return (
    <div>
      <Head>
        <title>New Email</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr]">
        <ChatSidebar chatId={chatId} />
        <div className="flex flex-col overflow-hidden bg-gray-700">
          <div className="flex flex-1 flex-col-reverse overflow-y-scroll text-white">
            {!allMessages.length && !incomingMessage && (
              <div className="m-auto flex items-center justify-center text-center">
                <div>
                  <FontAwesomeIcon
                    icon={faEnvelopeOpen}
                    className="text-6xl text-emerald-200"
                  />
                  <h1 className="mt-2 text-4xl font-bold text-white/50">
                    Let me help you write your email!
                  </h1>
                </div>
              </div>
            )}

            {!!allMessages.length && (
              <div className="mb-auto">
                {allMessages.map((message) => (
                  <Message
                    key={message._id}
                    role={message.role}
                    content={message.content}
                  />
                ))}
                {!!incomingMessage && !routeHasChanged && (
                  <Message role="assistant" content={incomingMessage} />
                )}
                {!!incomingMessage && !!routeHasChanged && (
                  <Message
                    role="notice"
                    content="Only one email at a time. Please allow any responses to complete before sending another message"
                  />
                )}
              </div>
            )}
          </div>
          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset className="">
                <div
                  className="grid grid-cols-4 gap-4"
                  disabled={generatingResponse}
                >
                  {/* <p
                    className={`text-white ${isSubmitted ? "block" : "hidden"}`}
                  >
                    Campaign name: {campaignName}
                  </p> */}
                  <textarea
                    value={campaignName}
                    required={!isSubmitted}
                    onChange={(e) => setCampaignName(e.target.value)}
                    // disabled={isSubmitted}
                    placeholder={
                      generatingResponse ? "" : "Campaign name: required."
                    }
                    className={`w-full resize-none rounded-md border border-gray-400 bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500  ${
                      isSubmitted ? "hidden" : "block"
                    }`}
                  />

                  <textarea
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder={generatingResponse ? "" : "Book title..."}
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                  <textarea
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder={generatingResponse ? "" : "Author..."}
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                  <textarea
                    value={introductionBy}
                    onChange={(e) => setIntroductionBy(e.target.value)}
                    placeholder={generatingResponse ? "" : "Introduced by..."}
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />

                  <textarea
                    value={keyWords}
                    onChange={(e) => setKeyWords(e.target.value)}
                    placeholder={
                      generatingResponse ? "" : "Comma seperated key words..."
                    }
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                  <textarea
                    value={bookBinding}
                    onChange={(e) => setBookBinding(e.target.value)}
                    placeholder={
                      generatingResponse ? "" : "Describe the book binding..."
                    }
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                  <textarea
                    value={addInformation}
                    onChange={(e) => setAddInformation(e.target.value)}
                    placeholder={
                      generatingResponse
                        ? ""
                        : "Provide anymore information you think relevant..."
                    }
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                  <textarea
                    value={voiceTone}
                    onChange={(e) => setVoiceTone(e.target.value)}
                    placeholder={
                      generatingResponse ? "" : "Provide tone of voice..."
                    }
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                </div>

                <div className="flex justify-center gap-2 pt-4">
                  <label className=" align-items-center flex items-center  justify-center text-white">
                    No. of words
                  </label>
                  <input
                    type="number"
                    required
                    value={numberofWords}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue >= 1 && inputValue <= 1000) {
                        setNumberofWords(inputValue);
                      }
                    }}
                    placeholder={generatingResponse ? "" : "Number of words..."}
                    className="resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />

                  <button
                    type="submit"
                    className={`btn px-10 ${
                      generatingResponse ? "cursor-not-allowed opacity-50" : ""
                    }`}
                  >
                    Submit
                  </button>
                </div>
              </fieldset>
            </form>
            <div>
              {networkError && (
                <div className="flex justify-center bg-red-700 text-white">
                  {networkError}
                </div>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

// get the id so we can send vai props to sidebar
export const getServerSideProps = async (ctx) => {
  const chatId = ctx.params?.chatId?.[0] || null;
  if (chatId) {
    let objectId;

    try {
      objectId = new ObjectId(chatId);
    } catch (error) {
      return {
        redirect: {
          destination: "/chat ",
        },
      };
    }

    const { user } = await getSession(ctx.req, ctx.res);
    const client = await clientPromise;
    const db = client.db("EmailBuddy");
    const chat = await db.collection("chats").findOne({
      userId: user.sub,
      _id: objectId,
    });
    //console.log("Fetched chat:", chat); //am seeing title, but only shows on page when it is refreshed.
    if (!chat) {
      return {
        redirect: {
          destination: "/chat",
        },
      };
    }
    return {
      props: {
        chatId,
        title: chat.title,
        messages: chat.messages.map((message) => ({
          ...message,
          _id: uuid(),
        })),
      },
    };
  }
  return {
    props: {},
  };
};
