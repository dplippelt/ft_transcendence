import type React from "react";
import SettingsProvider from "./SettingsContext";
import AuthProvider from "./AuthContext";
import FriendsProvider from "./FriendsContext";
import ChatHistoryProvider from "./ChatHistoryContext";
import LobbiesProvider from "./LobbiesContext";
import ErrorProvider from "./ErrorContext";
import OperatorsProvider from "./OperatorContext";
import WebSocketProvider from "./WebSocketContext";

export default function AppProviders( { children } : { children: React.ReactNode } )
{
    return (
        <AuthProvider>
            <WebSocketProvider>
                <LobbiesProvider>
                    <ChatHistoryProvider>
                        <FriendsProvider>
                            <SettingsProvider>
                                <ErrorProvider>
                                    <OperatorsProvider>
                                        {children}
                                    </OperatorsProvider>
                                </ErrorProvider>
                            </SettingsProvider>
                        </FriendsProvider>
                    </ChatHistoryProvider>
                </LobbiesProvider>
            </WebSocketProvider>
        </AuthProvider>
    );

}
