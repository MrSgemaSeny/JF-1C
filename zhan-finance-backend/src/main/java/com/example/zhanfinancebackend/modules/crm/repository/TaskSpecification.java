package com.example.zhanfinancebackend.modules.crm.repository;

import com.example.zhanfinancebackend.modules.crm.entity.Task;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class TaskSpecification {

    public static Specification<Task> filterTasks(Long clientId, Long assignedToId, Long stageId, Boolean unassigned) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (clientId != null) {
                predicates.add(cb.equal(root.get("client").get("id"), clientId));
            }
            if (Boolean.TRUE.equals(unassigned)) {
                predicates.add(cb.isNull(root.get("assignedTo")));
            } else if (assignedToId != null) {
                predicates.add(cb.equal(root.get("assignedTo").get("id"), assignedToId));
            }
            if (stageId != null) {
                predicates.add(cb.equal(root.get("stage").get("id"), stageId));
            }

            // To avoid N+1, fetch associations if this is not a count query
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("client", JoinType.LEFT).fetch("assignedEmployee", JoinType.LEFT);
                root.fetch("assignedTo", JoinType.LEFT);
                root.fetch("createdBy", JoinType.LEFT);
                root.fetch("stage", JoinType.LEFT);
                
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
