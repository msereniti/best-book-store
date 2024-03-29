import React, { useState } from "react";
import { Swipeable, direction } from "react-deck-swiper";
import dynamic from "next/dynamic";
import styles from "./Swipe.module.css";
import { config } from "../config";
import { store } from "./store";
import { List, Avatar, notification, Button, Skeleton } from "antd";
import cx from "classnames";
import { runInAction } from "mobx";

const getRandomColor = seed => {
  const colors = [
    "#F1828D",
    "#FCD0BA",
    "#765D69",
    "#8FB9A8",
    "#CC2A49",
    "#F99E4C",
    "#F36F38",
    "#EF4648"
  ];
  seed = (seed || "test")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const color = seed % colors.length;

  return colors[color];
};

const Card = ({
  introCard = false,
  finalCard = false,
  color,
  url,
  book,
  background = false
}) => {
  return introCard ? (
    <div
      className={cx(styles.swipeCard, background && styles.backgroundCard)}
      style={{
        backgroundColor: color
      }}
    >
      <video
        className={styles.swipeCardVideo}
        autoPlay={true}
        loop={true}
        muted={true}
        src={url}
      />
    </div>
  ) : (
    <div
      className={styles.swipeCard}
      style={{
        backgroundColor: "white"
        // getRandomColor(book ? book.imageLink : url)
      }}
    >
      {book ? (
        <div className={styles.recommendedBook}>
          <div
            className={styles.avatar}
            style={{
              backgroundImage: `url( ${book.imageLink})`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          ></div>
          {/* <img className={styles.avatar} src={book.imageLink} /> */}
          <div className={styles.title}>
            {" "}
            {book.author ? `${book.author}: ${book.title}` : " "}
          </div>
          {book.description && (
            <div className={styles.description}>{book.description}</div>
          )}
          {book.price ? (
            <Button
              className={styles.buyButton}
              shape="circle"
              size="large"
              type="action"
              // backgroundColor="white"
              onClick={() => {
                runInAction(() => {
                  const existingBook = store.cart.find(
                    item => item.book.id === book.id
                  );
                  store.cartVisible = true;
                  if (!existingBook) {
                    store.cart.push({ book, amount: 1 });
                  } else {
                    existingBook.amount++;
                  }
                });
              }}
            >
              🛒
            </Button>
          ) : (
            <div>{"\n"}</div>
          )}
        </div>
      ) : (
        <div className={styles.recommendedBook}>
          <Skeleton.Avatar size={200} />
          <Skeleton paragraph={3} />
        </div>
      )}
    </div>
  );
};

export const Swipe = () => {
  const [cardIndex, setCardIndex] = useState(0);

  const [welcomeCards, setWelcomeCards] = useState([]);
  React.useEffect(() => {
    fetch(`${config.apiUrl}/cards`, { method: "get" })
      .then(data => data.json())
      .then(setWelcomeCards)
      .catch(err => {
        console.error(err);
        notification.open({
          message: "Our server is being down 🤯",
          description: "Our team of the web monkeys are on the way to fix it"
        });
      });
  }, []);

  const [books, setBooks] = useState([]);
  const [finalCard, setFinalCard] = useState(false);
  const loadBook = React.useCallback(() => {
    fetch(`${config.apiUrl}/book?user_id=${store.userId}`, { method: "get" })
      .then(data => data.json())
      .then(data => {
        console.log(data);
        if (data.found === true) {
          setBooks(books => [data.book, ...books]);
        } else {
          setBooks([
            {
              imageLink:
                "https://cdn.pixabay.com/photo/2018/02/17/17/33/sorry-3160426_960_720.png",
              description:
                "Sorry, you have watched all the books recommended to you. You can use searching now"
            },
            ...books
          ]);
          setFinalCard(true);
        }
      })
      .catch(err => {
        console.error(err);
        notification.open({
          message: "Our server is being down 🤯",
          description: "Our team of the web monkeys are on the way to fix it"
        });
      });
  }, []);

  React.useEffect(loadBook, []);
  const sendRate = React.useCallback(
    isGood => {
      if (!books[1]) {
        return;
      }
      const formData = new FormData();
      formData.append("user_id", store.userId.toString());
      formData.append("book_id", books[1].id);
      formData.append("good", isGood);
      fetch(`${config.apiUrl}/rate`, {
        method: "post",
        body: formData
      }).catch(err => {
        console.error(err);
        notification.open({
          message: "Our server is being down 🤯",
          description: "Our team of the web monkeys are on the way to fix it"
        });
      });
    },
    [books[1]]
  );
  const handleSwipe = direction => {
    console.log("handleSwipe", direction);
    sendRate(direction === "right");

    setCardIndex(cardIndex + 1);
    if (cardIndex >= welcomeCards.length - 2) loadBook();
  };

  const [nextCardAlmostVisible, setNextCardAlmostVisible] = React.useState(
    false
  );

  const bookIndex = books.length + welcomeCards.length - cardIndex - 1;
  console.log(bookIndex);
  console.log(books);

  return (
    <div className={styles.cardContainer}>
      {[
        <Swipeable key={cardIndex} onSwipe={handleSwipe}>
          <Card
            introCard={Boolean(welcomeCards[cardIndex])}
            color={welcomeCards[cardIndex] && welcomeCards[cardIndex].color}
            url={
              welcomeCards[cardIndex] &&
              `${config.staticUrl}/${welcomeCards[cardIndex].url}`
            }
            book={books[bookIndex]}
            finalCard={finalCard}
          />
        </Swipeable>
      ]}
    </div>
  );
};
