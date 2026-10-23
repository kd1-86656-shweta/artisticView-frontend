import { useParams } from 'react-router-dom';
import ChatList from './ChatList';
import Conversation from './Conversation';

/** /messages (list) and /messages/:id (list + open chat). On phones only one pane shows at a time. */
export default function MessagesPage() {
  const id = useParams().id;
  return (
    <div className={`chat-shell ${id ? 'has-chat' : ''}`}>
      <ChatList />
      {id ? <Conversation key={id} chatId={Number(id)} /> : (
        <div className="chat-main chat-empty">
          <i className="bi bi-chat-heart fs-1" />
          <p className="mb-0">Pick a chat, or start a new one with the pencil button.</p>
        </div>
      )}
    </div>
  );
}
