import { ChatSidebar } from "components/chatSidebar";
import Head from "next/head";
import { useState } from "react";
import { streamReader } from "openai-edge-stream";

export default function ChatPage() {
  // const [messageText, setMessageText] = useState("");
  const [incomingMessage, setIncomingMessage] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [keyWords, setKeyWords] = useState("");
  const [author, setAuthor] = useState("");
  const [bookBinding, setBookBinding] = useState("");
  const [addInformation, setAddInformation] = useState("");

  const messageText = `we are a company called The Folio Society that re-publishes and sells existing books and we craft them with new bindling and illustration. It is a well known quality product.Write me a marketing email about a book called ${bookTitle}, by the author ${author}, the book binding is ${bookBinding} use the comma separated keywords of ${keyWords},take into account ${addInformation}. Only write 80 words`;

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
              <fieldset className="">
                <div className="flex gap-2">
                  <textarea
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="Book title..."
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                  <textarea
                    value={keyWords}
                    onChange={(e) => setKeyWords(e.target.value)}
                    placeholder="comma seperated key words..."
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                </div>
                <div className="flex gap-2 py-2">
                  <textarea
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="The author..."
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                  <textarea
                    value={bookBinding}
                    onChange={(e) => setBookBinding(e.target.value)}
                    placeholder="describe the book binding..."
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <textarea
                    value={addInformation}
                    onChange={(e) => setAddInformation(e.target.value)}
                    placeholder="provide anymore information you think relevant..."
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  />
                </div>
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
