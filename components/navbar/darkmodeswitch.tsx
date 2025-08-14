import React from "react";
import { useTheme as useNextTheme } from "next-themes";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@nextui-org/react";
import { BsMoonStarsFill } from "react-icons/bs";
import { MdWbSunny } from "react-icons/md";
const DarkModeSwitch = () => {
  const { setTheme, resolvedTheme } = useNextTheme();

  return (
    <Dropdown closeOnSelect={false}>
      <DropdownTrigger>
        <Button
          isIconOnly
          radius="full"
          variant="bordered"
          className="w-10 h-10"
        >
          {resolvedTheme === "dark" ? (
            <BsMoonStarsFill className="h-5 w-5 text-blue-500" />
          ) : (
            <MdWbSunny className="h-5 w-5 text-yellow-500" />
          )}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Theme selection"
        onAction={(key) => setTheme(key.toString())}
      >
        <DropdownItem
          key="light"
          startContent={<MdWbSunny className="h-4 w-4 text-yellow-500" />}
        >
          Light
        </DropdownItem>
        <DropdownItem
          key="dark"
          startContent={<BsMoonStarsFill className="h-4 w-4 text-blue-500" />}
        >
          Dark
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default DarkModeSwitch;
