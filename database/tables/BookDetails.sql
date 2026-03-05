use astra_lms;
CREATE TABLE books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    author_id INT NOT NULL,
    publisher VARCHAR(150),

    isbn VARCHAR(20) UNIQUE,

    language VARCHAR(50),

    price DECIMAL(10,2) DEFAULT 0.00,

    description TEXT,

    category_id INT NULL,

    cover_image VARCHAR(255),
	
	number_of_copies INT ,
	

	

    CONSTRAINT fk_book_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);