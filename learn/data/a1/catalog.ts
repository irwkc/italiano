import { tasksCh01 } from "@/learn/data/a1/ch01";
import { tasksCh02 } from "@/learn/data/a1/ch02";
import { tasksCh03 } from "@/learn/data/a1/ch03";
import { tasksCh04 } from "@/learn/data/a1/ch04";
import { tasksCh05 } from "@/learn/data/a1/ch05";
import { tasksCh06 } from "@/learn/data/a1/ch06";
import { tasksCh07 } from "@/learn/data/a1/ch07";
import { tasksCh08 } from "@/learn/data/a1/ch08";
import { tasksCh09 } from "@/learn/data/a1/ch09";
import { tasksCh10 } from "@/learn/data/a1/ch10";
import type { A1Task } from "@/learn/data/a1/types";

export const A1_TASKS: readonly A1Task[] = [
  ...tasksCh01,
  ...tasksCh02,
  ...tasksCh03,
  ...tasksCh04,
  ...tasksCh05,
  ...tasksCh06,
  ...tasksCh07,
  ...tasksCh08,
  ...tasksCh09,
  ...tasksCh10,
];

export const A1_TASKS_BY_CHAPTER: readonly (readonly A1Task[])[] = [
  tasksCh01,
  tasksCh02,
  tasksCh03,
  tasksCh04,
  tasksCh05,
  tasksCh06,
  tasksCh07,
  tasksCh08,
  tasksCh09,
  tasksCh10,
];
