USE astra_lms;

DROP TABLE IF EXISTS book_copies;

CREATE TABLE book_copies (
    copy_id INT PRIMARY KEY,

    book_id INT NOT NULL,

    status ENUM('available','unavailable') 
           DEFAULT 'available',


    CONSTRAINT fk_copy_book
        FOREIGN KEY (book_id)
        REFERENCES books(book_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);