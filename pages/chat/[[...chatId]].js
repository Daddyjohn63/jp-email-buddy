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
  console.log("props:", title, messages);
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

  const messageText = `we are a company that re-publishes and sells existing books and we craft them with a new book binding and illustrations. It is a well known quality product.Write me a marketing email about a book called ${bookTitle}, by the author ${author}, it is introduced by ${introductionBy}. The book binding is ${bookBinding} and the illustrations by ${bookIllustrator}.Use the comma separated keywords of ${keyWords},take into account ${addInformation}. Only write ${numberofWords} words and use the following tone of voice ${voiceTone} and add the subject title in h2 markup`;

  const messageTitle = `${campaignName}`;
  const router = useRouter();

  //when our route changes / reset if the chatId changes
  useEffect(() => {
    setNewChatMessages([]);
    setNewChatId(null);
  }, [chatId]);

  // save the newly streamed message to new chat messages
  useEffect(() => {
    if (!generatingResponse && fullMessage) {
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
  }, [generatingResponse, fullMessage]);

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
    //setCampaignName("");
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
    );

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
      console.log("MESSAGE: ", message);
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
          <div className="flex-1 overflow-y-scroll text-white">
            {allMessages.map((message) => (
              <Message
                key={message._id} //key needed as we are mapping over an array.
                role={message.role}
                content={message.content}
              />
            ))}
            {!!incomingMessage && (
              <Message role="assistant" content={incomingMessage} />
            )}
          </div>
          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset className="">
                <div
                  className="grid grid-cols-4 gap-4"
                  disabled={generatingResponse}
                >
                  <textarea
                    value={campaignName}
                    required
                    onChange={(e) => setCampaignName(e.target.value)}
                    disabled={isSubmitted}
                    placeholder={
                      generatingResponse ? "" : "Campaign name..(required)."
                    }
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
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

                <div className="flex justify-center gap-2 pt-2">
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
    const { user } = await getSession(ctx.req, ctx.res);
    const client = await clientPromise;
    const db = client.db("EmailBuddy");
    const chat = await db.collection("chats").findOne({
      userId: user.sub,
      _id: new ObjectId(chatId),
    });

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
