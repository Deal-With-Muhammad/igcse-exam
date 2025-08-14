import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  Button,
  NavbarItem,
} from "@nextui-org/react";
import React, { useCallback, useState } from "react";
import DarkModeSwitch from "./darkmodeswitch";
import { useRouter } from "next/navigation";
// import { deleteAuthCookie } from "@/actions/auth.action";
import { IoIosMenu } from "react-icons/io";
// import { SettingsIcon } from "../icons/sidebar/settings-icon";
import { User } from "lucide-react";
// import UserProfile from "../profile/UserProfile";

export const UserDropdown = () => {
  return (
    <>
      <DarkModeSwitch />
    </>
  );
};
