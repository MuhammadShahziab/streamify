import {create} from "zustand";

interface OnlineUsersState {
    onlineUsers: string[],
    setOnlineUsers: (users: [string]) => void,
}

export const useOnlineUsersStore = create<OnlineUsersState>((set)=>({
    onlineUsers: [],
    setOnlineUsers: (users: [string]) => set({onlineUsers: users}),
}))

