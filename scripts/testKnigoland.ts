import { getBookFromKnigoland } from "../src/providers/knigolandProvider.js";

const test = async () => {
  try {
    const book = await getBookFromKnigoland("9789661450706");

    console.log(book);
  } catch (error) {
    console.error(error);
  }
};

test();