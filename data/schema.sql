DROP TABLE IF EXISTS characters;  

CREATE TABLE characters(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    house VARCHAR(255),
    patronus VARCHAR(255),
    alive BOOLEAN,
    creat_by VARCHAR(255)
);