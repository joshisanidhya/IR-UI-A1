
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class Main {

    public static void main(String[] args) {

        long start = System.currentTimeMillis();

        PositionalIndex index = new PositionalIndex();
        List<String> documents = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                    new FileInputStream("../data/hindi_10k.txt"),
                    StandardCharsets.UTF_8))) {

            String line;

            while ((line = reader.readLine()) != null) {
                // Keep every line as one document so IDs
                // match the original dataset line numbers.
                documents.add(line);

                String[] tokens = Tokenizer.tokenize(line);
                index.addDocument(documents.size(), tokens);
            }

            long indexingTime = System.currentTimeMillis() - start;

            System.out.println("===== HINDI IR BACKEND =====");
            System.out.println("Documents indexed: " + documents.size());
            System.out.println("Unique terms: " + index.getUniqueTerms());
            System.out.println("Indexing time: " + indexingTime + " ms");

            SearchServer.start(index, documents, indexingTime);

        } catch (IOException e) {
            System.err.println("Backend error: " + e.getMessage());
        }
    }
}