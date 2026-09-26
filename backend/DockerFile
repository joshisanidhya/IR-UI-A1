FROM eclipse-temurin:21-jdk

WORKDIR /backend

COPY data ./data
COPY src ./src

RUN javac src/Main.java \
    src/PositionalIndex.java \
    src/Tokenizer.java \
    src/SearchServer.java

EXPOSE 10000

CMD ["java", "-cp", "src", "Main"]