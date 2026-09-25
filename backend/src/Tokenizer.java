public class Tokenizer {

    public static String[] tokenize(String text) {

        // Remove Hindi danda and common punctuation
        text = text.replaceAll("[।॥,!?;:\"()\\[\\]{}]", " ");

        // Split using one or more whitespace characters
        return text.trim().split("\\s+");
    }
}