

-- Tables
-- Step 1: Create independent tables or tables needed by others
source D:/ASTRABOOKISHSEARCH/tables/roles.sql;
source D:/ASTRABOOKISHSEARCH/tables/categories.sql;
source D:/ASTRABOOKISHSEARCH/tables/authors.sql;

-- Step 2: Create tables with foreign key dependencies
source D:/ASTRABOOKISHSEARCH/tables/users.sql;
source D:/ASTRABOOKISHSEARCH/tables/BookDetails.sql;

-- Step 3: Create the final dependent table
source D:/ASTRABOOKISHSEARCH/tables/Bookcopies.sql;

-- PROCEDURES
source D:/ASTRABOOKISHSEARCH/Procedures/EmailValidate.sql;
source D:/ASTRABOOKISHSEARCH/Procedures/passwordstrength.sql;
source D:/ASTRABOOKISHSEARCH/Procedures/passwordencryption.sql;

-- Step 2: User Management (Registration, Login, Profile, Deletion)
source D:/ASTRABOOKISHSEARCH/Procedures/registration.sql;
source D:/ASTRABOOKISHSEARCH/Procedures/loginprocedure.sql;
source D:/ASTRABOOKISHSEARCH/Procedures/adminlogin.sql;
source D:/ASTRABOOKISHSEARCH/Procedures/admininsertion.sql;
source D:/ASTRABOOKISHSEARCH/Procedures/profilechandingnormaluser.sql;
source D:/ASTRABOOKISHSEARCH/Procedures/profilechangeadmin.sql;
source D:/ASTRABOOKISHSEARCH/Procedures/userdeletion.sql;

-- Step 3: Book Management & Search
source D:/ASTRABOOKISHSEARCH/Procedures/Bookinsertion[onlydetails].sql;
source D:/ASTRABOOKISHSEARCH/Procedures/bookcopyinsertion.sql;
source D:/ASTRABOOKISHSEARCH/Procedures/bookcopystatus.sql;
source D:/ASTRABOOKISHSEARCH/Procedures/booksdetailchange(modification).sql;
source D:/ASTRABOOKISHSEARCH/Procedures/search.sql