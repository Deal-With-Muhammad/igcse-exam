"use client";

import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Chip } from "@heroui/react";
import { LogOut, ShieldCheck, GraduationCap, FileText, Users, Layout, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeSwitch } from "./theme-switch";
import type { Profile } from "@/types";
import toast from "react-hot-toast";
import { SCHOOL_NAME } from "@/lib/constants";
import Image from "next/image";

interface Props {
  profile: Profile;
}

export function AppNavbar({ profile }: Props) {
  const router = useRouter();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/sign-in");
    router.refresh();
  };

  const isAdmin = profile.role === "admin";
  const initials = profile.full_name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <Navbar isBordered maxWidth="full" className="px-2 md:px-6">
      <NavbarBrand as={Link} href="/dashboard" className="gap-2 cursor-pointer">
        <Image src="/logo.png" alt="logo" width={32} height={32} className="rounded-full" />
        <span className="font-bold text-base md:text-lg">{SCHOOL_NAME} Exam</span>
      </NavbarBrand>

      <NavbarContent justify="center" className="hidden md:flex gap-2">
        <NavbarItem>
          <Button as={Link} href="/dashboard" variant="light" startContent={<FileText size={16} />} size="sm">
            Exams
          </Button>
        </NavbarItem>
        {isAdmin && (
          <>
            <NavbarItem>
              <Button as={Link} href="/admin/teachers" variant="light" startContent={<Users size={16} />} size="sm">
                Teachers
              </Button>
            </NavbarItem>
            <NavbarItem>
              <Button as={Link} href="/admin/templates" variant="light" startContent={<Layout size={16} />} size="sm">
                Templates
              </Button>
            </NavbarItem>
            <NavbarItem>
              <Button as={Link} href="/admin/classes" variant="light" startContent={<BookOpen size={16} />} size="sm">
                Classes
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      <NavbarContent justify="end" className="gap-2">
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button className="outline-none">
                <Avatar name={initials} size="sm" color={isAdmin ? "secondary" : "primary"} />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile menu">
              <DropdownItem key="profile" isReadOnly className="opacity-100 cursor-default">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{profile.full_name || profile.email}</span>
                  <Chip size="sm" color={isAdmin ? "secondary" : "primary"} variant="flat" className="mt-1">
                    {isAdmin ? <ShieldCheck size={12} className="mr-1" /> : <GraduationCap size={12} className="mr-1" />}
                    {profile.role}
                  </Chip>
                </div>
              </DropdownItem>
              <DropdownItem key="signout" color="danger" startContent={<LogOut size={16} />} onPress={signOut}>
                Sign out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
