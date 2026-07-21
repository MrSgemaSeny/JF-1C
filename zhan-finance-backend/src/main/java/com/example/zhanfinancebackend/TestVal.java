package com.example.zhanfinancebackend;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import com.example.zhanfinancebackend.modules.crm.dto.TaskRequestCreateRequest;
import jakarta.validation.ConstraintViolation;
import java.util.Set;

public class TestVal {
    public static void main(String[] args) {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        Validator validator = factory.getValidator();
        TaskRequestCreateRequest req = new TaskRequestCreateRequest("Заказ услуги: Название", "", null, null, null, java.util.List.of(1L));
        Set<ConstraintViolation<TaskRequestCreateRequest>> violations = validator.validate(req);
        for (ConstraintViolation<TaskRequestCreateRequest> violation : violations) {
            System.out.println("VIOLATION: " + violation.getPropertyPath() + " " + violation.getMessage());
        }
        System.out.println("Validation complete.");
    }
}
