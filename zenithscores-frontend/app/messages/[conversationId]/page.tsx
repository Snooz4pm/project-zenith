import MessagesPage from '../page';

/**
 * Route: /messages/[conversationId]
 * Reuse the main MessagesPage which now supports params.conversationId
 */
export default function MessageConversationPage({ params }: { params: { conversationId: string } }) {
    return <MessagesPage params={params} />;
}
