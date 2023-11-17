import { ChatSidebar } from "components/chatSidebar";
import Head from "next/head";
import { useState } from "react";
import { streamReader } from "openai-edge-stream";
import { v4 as uuid } from "uuid";
import { Message } from "components/Message";

export default function ChatPage() {
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
  const [numberofWords, setNumberofWords] = useState(80);
  const [newChatMessages, setNewChatMessages] = useState([]);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const messageText = `we are a company that re-publishes and sells existing books and we craft them with a new book binding and illustrations. It is a well known quality product.Write me a marketing email about a book called ${bookTitle}, by the author ${author}, it is introduced by ${introductionBy}. The book binding is ${bookBinding} and the illustrations by ${bookIllustrator}.Use the comma separated keywords of ${keyWords},take into account ${addInformation}. Only write ${numberofWords} words and use the following tone of voice ${voiceTone} and add the subject title in h2 markup`;

  const messageTitle = `${campaignName}`;

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
    setNumberofWords(0);
    const response = await fetch(`/api/chat/createNewChat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: messageText,
        title: messageTitle,
      }),
    });
    const json = await response.json();
    console.log("NEW CHAT:", json);
    // console.log("MESSAGETEXT:", messageText);
    //hit send message endpoint

    /*const response = await fetch(`/api/chat/sendMessage`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: messageText }),
    });
    //get the reader so we can read the response coming back from the sendMessage endpoint.
    const data = response.body;
    if (!data) {
      return;
    }
    const reader = data.getReader();
    await streamReader(reader, (message) => {
      console.log("MESSAGE: ", message);
      setIncomingMessage((s) => `${s}${message.content}`);
    });
    */

    setGeneratingResponse(false);
    setIsSubmitted(true);
  };

  return (
    <div>
      <Head>
        <title>New Email</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr]">
        <ChatSidebar />
        <div className="flex flex-col overflow-hidden bg-gray-700">
          <div className="flex-1 overflow-y-scroll text-white">
            {newChatMessages.map((message) => (
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

                  <input
                    type="number"
                    required
                    value={numberofWords}
                    onChange={(e) => setNumberofWords(e.target.value)}
                    placeholder={generatingResponse ? "" : "number of words..."}
                    className=" w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                </div>

                <div className="flex justify-center pt-2">
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
