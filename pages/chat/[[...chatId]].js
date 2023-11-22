import { faRobot } from "@fortawesome/free-solid-svg-icons";
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
  const [numberofWords, setNumberofWords] = useState("");
  const [newChatMessages, setNewChatMessages] = useState([]);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [newChatId, setNewChatId] = useState(null);
  const [fullMessage, setFullMessage] = useState("");
  const [originalChatId, setOriginalChatId] = useState(chatId);

  const messageText = `we are a company that re-publishes and sells existing books and we craft them with a new book binding and illustrations. It is a well known quality product.Write me a marketing email about a book called ${bookTitle}, by the author ${author}, it is introduced by ${introductionBy}. The book binding is ${bookBinding} and the illustrations by ${bookIllustrator}.Use the comma separated keywords of ${keyWords},take into account ${addInformation}. Only write ${numberofWords} words and use the following tone of voice ${voiceTone} and add the subject title in h2 markup`;

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
    setNumberofWords("");

    //console.log("NEW CHAT:", json);
    // console.log("MESSAGETEXT:", messageText);
    //hit send message endpoint

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
    //get the reader so we can read the response coming back from the sendMessage endpoint.
    const data = response.body;
    if (!data) {
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
                    icon={faRobot}
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
                      generatingResponse ? "" : "Campaign name..(required)."
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
                      generatingResponse ? "" : "comma seperated key words..."
                    }
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                  <textarea
                    value={bookBinding}
                    onChange={(e) => setBookBinding(e.target.value)}
                    placeholder={
                      generatingResponse ? "" : "describe the book binding..."
                    }
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                  <textarea
                    value={addInformation}
                    onChange={(e) => setAddInformation(e.target.value)}
                    placeholder={
                      generatingResponse
                        ? ""
                        : "provide anymore information you think relevant..."
                    }
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                  <textarea
                    value={voiceTone}
                    onChange={(e) => setVoiceTone(e.target.value)}
                    placeholder={
                      generatingResponse ? "" : "provide tone of voice..."
                    }
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                </div>

                <div className="flex justify-center gap-2 pt-4">
                  <input
                    type="number"
                    required
                    value={numberofWords}
                    onChange={(e) => setNumberofWords(e.target.value)}
                    placeholder={generatingResponse ? "" : "number of words..."}
                    className="  resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
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
