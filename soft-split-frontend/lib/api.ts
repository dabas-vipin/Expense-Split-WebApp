import axios from "axios"
import { toast } from "@/components/ui/use-toast"
import { redirect } from "next/navigation"

// Create axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token")

    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (!error.response) {
      toast({
        title: 'Network Error',
        description: 'Please check your internet connection',
        variant: 'destructive'
      })
      return Promise.reject(error)
    }

    switch (error.response.status) {
      case 401:
        localStorage.removeItem("token")
        redirect("/login")
        break
      case 403:
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to perform this action',
          variant: 'destructive'
        })
        break
      case 422:
        toast({
          title: 'Validation Error',
          description: 'Please check your input and try again',
          variant: 'destructive'
        })
        break
      default:
        toast({
          title: 'Error',
          description: 'Something went wrong. Please try again later',
          variant: 'destructive'
        })
    }

    return Promise.reject(error)
  },
)

