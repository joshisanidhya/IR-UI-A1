
import java.util.*;

public class PositionalIndex {

    private final Map<String, Map<Integer, List<Integer>>> index =
            new HashMap<>();

    private long totalPositions = 0;

    public void addDocument(int docId, String[] tokens) {
        for (int position = 0; position < tokens.length; position++) {
            String term = tokens[position];

            if (term.isEmpty()) {
                continue;
            }

            index.computeIfAbsent(term, k -> new HashMap<>())
                 .computeIfAbsent(docId, k -> new ArrayList<>())
                 .add(position);

            totalPositions++;
        }
    }

    // Single-term search
    public Map<Integer, List<Integer>> search(String term) {
        return index.getOrDefault(term, Collections.emptyMap());
    }

    // AND: documents containing both terms
    public Set<Integer> andSearch(String term1, String term2) {
        Set<Integer> result = new TreeSet<>(search(term1).keySet());
        result.retainAll(search(term2).keySet());
        return result;
    }

    // OR: documents containing either term
    public Set<Integer> orSearch(String term1, String term2) {
        Set<Integer> result = new TreeSet<>(search(term1).keySet());
        result.addAll(search(term2).keySet());
        return result;
    }

    // Exact phrase search
    public Map<Integer, List<Integer>> phraseSearch(String phrase) {
        String[] terms = Tokenizer.tokenize(phrase);
        Map<Integer, List<Integer>> result = new TreeMap<>();

        if (terms.length == 0 || terms[0].isEmpty()) {
            return result;
        }

        Map<Integer, List<Integer>> first = search(terms[0]);

        for (Map.Entry<Integer, List<Integer>> entry : first.entrySet()) {
            int docId = entry.getKey();
            List<Integer> matches = new ArrayList<>();

            for (int start : entry.getValue()) {
                boolean matched = true;

                for (int offset = 1; offset < terms.length; offset++) {
                    List<Integer> positions =
                            search(terms[offset]).get(docId);

                    if (positions == null ||
                        Collections.binarySearch(
                                positions, start + offset) < 0) {
                        matched = false;
                        break;
                    }
                }

                if (matched) {
                    matches.add(start);
                }
            }

            if (!matches.isEmpty()) {
                result.put(docId, matches);
            }
        }

        return result;
    }

    // NEAR: absolute distance between positions <= distance
    public Map<Integer, List<Integer>> nearSearch(
            String term1, String term2, int distance) {

        Map<Integer, List<Integer>> result = new TreeMap<>();

        if (distance < 1) {
            return result;
        }

        Map<Integer, List<Integer>> first = search(term1);
        Map<Integer, List<Integer>> second = search(term2);

        for (int docId : first.keySet()) {
            if (!second.containsKey(docId)) {
                continue;
            }

            Set<Integer> matches = new TreeSet<>();

            for (int p1 : first.get(docId)) {
                for (int p2 : second.get(docId)) {
                    if (p1 != p2 && Math.abs(p1 - p2) <= distance) {
                        matches.add(p1);
                        matches.add(p2);
                    }
                }
            }

            if (!matches.isEmpty()) {
                result.put(docId, new ArrayList<>(matches));
            }
        }

        return result;
    }

    public int getUniqueTerms() {
        return index.size();
    }

    public long getTotalPositions() {
        return totalPositions;
    }
}