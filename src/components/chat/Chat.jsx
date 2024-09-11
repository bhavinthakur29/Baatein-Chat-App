import React, { useState, useEffect, useRef } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  doc,
  onSnapshot,
  getFirestore,
  updateDoc,
  arrayUnion,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";

const Chat = () => {
  const [chat, setChat] = useState(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, user } = useChatStore();
  const db = getFirestore();

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    let unSub;
    if (chatId && typeof chatId === "string") {
      try {
        const docRef = doc(db, "chats", chatId);
        unSub = onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setChat(docSnap.data());
            } else {
              console.log("No such document!");
            }
          },
          (error) => {
            console.error("Error fetching chat:", error);
          }
        );
      } catch (error) {
        console.error("Error setting up listener:", error);
      }
    } else {
      console.log("Invalid chatId:", chatId);
    }

    return () => {
      if (unSub) unSub();
    };
  }, [chatId, db]);

  const handleSend = async () => {
    if (text.trim() === "") return; // Prevent sending empty messages

    try {
      const messageData = {
        senderId: currentUser.id,
        text,
        createdAt: serverTimestamp(), // Use serverTimestamp for consistency
      };

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion(messageData),
      });

      const userIDs = [currentUser.id, user.id];

      await Promise.all(
        userIDs.map(async (id) => {
          const userChatRef = doc(db, "userchats", id);
          const userChatsSnapshot = await getDoc(userChatRef);

          if (userChatsSnapshot.exists()) {
            const userChatsData = userChatsSnapshot.data();
            const chatIndex = userChatsData.chats.findIndex(
              (c) => c.chatId === chatId
            );

            if (chatIndex !== -1) {
              userChatsData.chats[chatIndex] = {
                ...userChatsData.chats[chatIndex],
                lastMessage: text,
                isSeen: id === currentUser.id,
                updatedAt: serverTimestamp(),
              };

              await updateDoc(userChatRef, {
                chats: userChatsData.chats,
              });
            }
          }
        })
      );

      setText(""); // Clear input after sending
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src="/avatar.png" alt="User Avatar" />
          <div className="texts">
            <span>{user?.displayName || "User"}</span>
            <p>{user?.status || "Online"}</p>
          </div>
        </div>
        <div className="icons">
          <img src="/phone.png" alt="Phone" />
          <img src="/video.png" alt="Video" />
          <img src="/info.png" alt="Info" />
        </div>
      </div>

      <div className="center">
        {chat?.messages?.map((message) => (
          <div
            className={`message ${
              message.senderId === currentUser.id ? "own" : ""
            }`}
            key={message.createdAt?.toMillis?.() || Date.now()}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="Message" />}
              <p>{message.text}</p>
            </div>
          </div>
        ))}
        <div ref={endRef}></div>
      </div>

      <div className="bottom">
        <div className="icons">
          <img src="/img.png" alt="Image" />
          <img src="/camera.png" alt="Camera" />
          <img src="/mic.png" alt="Microphone" />
        </div>
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <div className="emoji">
          <img
            src="/emoji.png"
            alt="Emoji"
            onClick={() => setOpen((prev) => !prev)}
          />
          {open && (
            <div className="picker">
              <EmojiPicker onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>
        <button className="sendButton" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
