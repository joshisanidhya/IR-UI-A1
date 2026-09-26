
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class SearchServer {

    private static PositionalIndex index;
    private static List<String> documents;
    private static long indexingTimeMs;

    public static void start(
            PositionalIndex positionalIndex,
            List<String> docs,
            long buildTime) throws IOException {

        index = positionalIndex;
        documents = docs;
        indexingTimeMs = buildTime;
int port = Integer.parseInt(
        System.getenv().getOrDefault("PORT", "10000")
);

HttpServer server = HttpServer.create(
        new InetSocketAddress("0.0.0.0", port),
        0
);

        server.createContext("/api/search", SearchServer::handleSearch);
        server.createContext("/api/document", SearchServer::handleDocument);
        server.createContext("/api/stats", SearchServer::handleStats);

        server.start();
        System.out.println(
    "Server running on port " + port
);
    }

    private static void handleSearch(HttpExchange exchange)
            throws IOException {

        if (!checkGet(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        Map<String, String> params;

        try {
            params = parseQuery(exchange.getRequestURI().getRawQuery());
        } catch (IllegalArgumentException e) {
            sendError(exchange, 400, "Invalid query encoding");
            return;
        }

        long start = System.nanoTime();

        String type;
        String query;
        Map<Integer, List<Integer>> results = new TreeMap<>();

        switch (path) {
            case "/api/search": {
                type = "term";
                String term = params.getOrDefault("term", "").trim();
                String[] tokens = Tokenizer.tokenize(term);

                if (tokens.length != 1 || tokens[0].isEmpty()) {
                    sendError(exchange, 400, "Exactly one term required");
                    return;
                }

                query = tokens[0];
                results.putAll(index.search(query));
                break;
            }

            case "/api/search/and":
            case "/api/search/or":
            case "/api/search/near": {
                String term1 = params.getOrDefault("term1", "").trim();
                String term2 = params.getOrDefault("term2", "").trim();

                String[] first = Tokenizer.tokenize(term1);
                String[] second = Tokenizer.tokenize(term2);

                if (first.length != 1 || second.length != 1 ||
                        first[0].isEmpty() || second[0].isEmpty()) {
                    sendError(exchange, 400, "Two single terms required");
                    return;
                }

                term1 = first[0];
                term2 = second[0];
                query = term1 + " " + term2;

                if (path.endsWith("/and")) {
                    type = "and";
                    for (int id : index.andSearch(term1, term2)) {
                        Set<Integer> positions = new TreeSet<>();
                        positions.addAll(index.search(term1).get(id));
                        positions.addAll(index.search(term2).get(id));
                        results.put(id, new ArrayList<>(positions));
                    }
                } else if (path.endsWith("/or")) {
                    type = "or";
                    for (int id : index.orSearch(term1, term2)) {
                        Set<Integer> positions = new TreeSet<>();
                        positions.addAll(index.search(term1)
                                .getOrDefault(id, List.of()));
                        positions.addAll(index.search(term2)
                                .getOrDefault(id, List.of()));
                        results.put(id, new ArrayList<>(positions));
                    }
                } else {
                    type = "near";
                    int distance;

                    try {
                        distance = Integer.parseInt(
                                params.getOrDefault("distance", ""));
                    } catch (NumberFormatException e) {
                        sendError(exchange, 400, "Valid distance required");
                        return;
                    }

                    if (distance < 1) {
                        sendError(exchange, 400, "Distance must be >= 1");
                        return;
                    }

                    query += " NEAR/" + distance;
                    results.putAll(
                            index.nearSearch(term1, term2, distance));
                }
                break;
            }

            case "/api/search/phrase": {
                type = "phrase";
                query = params.getOrDefault("query", "").trim();

                if (query.isEmpty()) {
                    sendError(exchange, 400, "Phrase required");
                    return;
                }

                results.putAll(index.phraseSearch(query));
                break;
            }

            default:
                sendError(exchange, 404, "Unknown search endpoint");
                return;
        }

        double timeMs = (System.nanoTime() - start) / 1_000_000.0;

        StringBuilder json = new StringBuilder();
        json.append("{\"type\":\"").append(type)
            .append("\",\"query\":\"").append(escapeJson(query))
            .append("\",\"count\":").append(results.size())
            .append(",\"searchTimeMs\":")
            .append(String.format(Locale.US, "%.3f", timeMs))
            .append(",\"results\":[");

        boolean firstResult = true;

        for (Map.Entry<Integer, List<Integer>> entry
                : results.entrySet()) {

            if (!firstResult) json.append(",");
            firstResult = false;

            int docId = entry.getKey();

            json.append("{\"docId\":").append(docId)
                .append(",\"positions\":")
                .append(entry.getValue())
                .append(",\"text\":\"")
                .append(escapeJson(documents.get(docId - 1)))
                .append("\"}");
        }

        json.append("]}");
        sendJson(exchange, 200, json.toString());
    }

    private static void handleDocument(HttpExchange exchange)
            throws IOException {

        if (!checkGet(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String prefix = "/api/document/";

        if (!path.startsWith(prefix)) {
            sendError(exchange, 400, "Document ID required");
            return;
        }

        int docId;

        try {
            docId = Integer.parseInt(path.substring(prefix.length()));
        } catch (NumberFormatException e) {
            sendError(exchange, 400, "Invalid document ID");
            return;
        }

        if (docId < 1 || docId > documents.size()) {
            sendError(exchange, 404, "Document not found");
            return;
        }

        sendJson(exchange, 200,
                "{\"docId\":" + docId +
                ",\"text\":\"" +
                escapeJson(documents.get(docId - 1)) + "\"}");
    }

    private static void handleStats(HttpExchange exchange)
            throws IOException {

        if (!checkGet(exchange)) return;

        sendJson(exchange, 200,
                "{\"documents\":" + documents.size() +
                ",\"uniqueTerms\":" + index.getUniqueTerms() +
                ",\"totalPositions\":" + index.getTotalPositions() +
                ",\"indexingTimeMs\":" + indexingTimeMs + "}");
    }

    private static boolean checkGet(HttpExchange exchange)
            throws IOException {

        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Methods", "GET, OPTIONS");
        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Headers", "Content-Type");

        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return false;
        }

        if (!"GET".equals(exchange.getRequestMethod())) {
            sendError(exchange, 405, "Only GET is supported");
            return false;
        }

        return true;
    }

    private static Map<String, String> parseQuery(String rawQuery) {

        Map<String, String> params = new HashMap<>();

        if (rawQuery == null) return params;

        for (String pair : rawQuery.split("&")) {
            String[] parts = pair.split("=", 2);

            String key = URLDecoder.decode(
                    parts[0], StandardCharsets.UTF_8);
            String value = parts.length == 2
                    ? URLDecoder.decode(parts[1], StandardCharsets.UTF_8)
                    : "";

            params.put(key, value);
        }

        return params;
    }

    private static String escapeJson(String value) {

        StringBuilder escaped = new StringBuilder();

        for (char c : value.toCharArray()) {
            switch (c) {
                case '"': escaped.append("\\\""); break;
                case '\\': escaped.append("\\\\"); break;
                case '\n': escaped.append("\\n"); break;
                case '\r': escaped.append("\\r"); break;
                case '\t': escaped.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        escaped.append(String.format("\\u%04x", (int)c));
                    } else {
                        escaped.append(c);
                    }
            }
        }

        return escaped.toString();
    }

    private static void sendError(
            HttpExchange exchange, int status, String message)
            throws IOException {

        sendJson(exchange, status,
                "{\"error\":\"" + escapeJson(message) + "\"}");
    }

    private static void sendJson(
            HttpExchange exchange, int status, String json)
            throws IOException {

        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set(
                "Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Origin", "*");

        exchange.sendResponseHeaders(status, bytes.length);

        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }
}