package com.example.zhanfinancebackend.modules.search;

import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class SearchService {

    public List<Map<String, Object>> globalSearch(String query) {
        // TODO: Implement actual global search logic across Task, Client, and Document modules
        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }
        return Collections.singletonList(
            Map.of("type", "PLACEHOLDER", "title", "Search results for: " + query)
        );
    }
}
