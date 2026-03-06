
USE astra_lms;
DELIMITER $$

DROP TRIGGER IF EXISTS trg_after_delete_book_copy $$

CREATE TRIGGER trg_after_delete_book_copy
AFTER DELETE ON book_copies
FOR EACH ROW
BEGIN

    UPDATE books
    SET number_of_copies = IFNULL(number_of_copies,0) - 1
    WHERE book_id = OLD.book_id;

END $$

DELIMITER ;;