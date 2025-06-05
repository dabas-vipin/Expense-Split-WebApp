export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  isAdmin: boolean
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Balance {
  userId: string
  amount: number
  user: {
    name: string
    avatar?: string
  }
}

export interface BalanceResponse {
  from: string
  fromName: string
  to: string
  toName: string
  amount: number
}

export interface FriendRequest {
  id: string;
  status: string;
  createdAt: string;
  sender: User;
  receiver: User;
}