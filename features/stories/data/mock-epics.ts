import { Epic } from "../types";

export const mockEpics: Epic[] = [
    {
    id: "1",
    code: "EPI-1",
    name: "User Registration & Login",
    description:
      "Includes user sign up, login, logout, password recovery, and authentication flows for both registered and guest users accessing the system.",
    user_stories: [
      {
        id: "s1",
        code: "SKI-1",
        as_a: "Registered User",
        i_want: "register for an account",
        so_that: "I can access personalized features and save my preferences",
      },
      {
        id: "s2",
        code: "SKI-2",
        as_a: "Registered User",
        i_want: "log in to my account",
        so_that: "I can access my personalized content, preferences, and dashboard",
      },
    ],
    },
    {
    id: "2",
    code: "EPI-2", 
    name: "User Profile Management",
    description:
      "Allows users to view, edit, and manage their personal information, including profile picture, contact details, and account settings.",
    user_stories: [],
    },
]