import { useState } from "react";
import { useUser, type IFriendData } from "../../contexts/UserContext";
import { SendButton } from "../Buttons";
import { ChatInput } from "../TextInput";
import styles from "./ChatBox.module.scss";

interface IChatBox
{
	activeFriend: IFriendData;
}

export default function ChatBox( { activeFriend } : IChatBox )
{
	const { addChatHistory } = useUser();
	const [msg, setMsg] = useState<string>("");

	function handleSend()
	{
		if ( msg.trim().length > 0 )
		{
			addChatHistory(activeFriend.username, msg);
			setMsg("");
		}
	}

	return (
		<div className={styles.chatBox}>
			<ChatInput placeholder="Type here..." onSend={handleSend} msg={msg} setMsg={setMsg} />
			<SendButton onClick={handleSend} />
		</div>
	);
}
