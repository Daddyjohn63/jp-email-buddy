import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  //grab the user id
  try {
    const { user } = await getSession(req, res);
    const { message, title } = req.body;
    const newUserMessage = {
      role: "user",
      content: message,
    };
    const client = await clientPromise;
    const db = client.db("EmailBuddy");
    const chat = await db.collection("chats").insertOne({
      userId: user.sub,
      messages: [newUserMessage],
      title: title,
    });
    res.status(200).json({
      _id: chat.insertedId.toString(),
      messages: [newUserMessage],
      title: title,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred when creating a new chat" });
    console.log("an error occured in create new chat:", error);
  }
}