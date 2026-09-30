package com.example.zhanfinancebackend.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.RestController;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

class ArchitectureTest {

    private static JavaClasses importedClasses;

    @BeforeAll
    static void setUp() {
        importedClasses = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("com.example.zhanfinancebackend");
    }

    @Test
    @DisplayName("P1-7: Controllers should be annotated with @RestController and reside in controller packages")
    void controllersShouldBeProperlyAnnotated() {
        ArchRule rule = classes()
                .that().haveSimpleNameEndingWith("Controller")
                .should().beAnnotatedWith(RestController.class);

        rule.check(importedClasses);
    }

    @Test
    @DisplayName("P1-7: Billing module must not directly depend on CRM repositories")
    void billingShouldNotDependOnCrmRepositories() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..modules.billing..")
                .should().dependOnClassesThat()
                .resideInAPackage("..modules.crm.repository..");

        rule.check(importedClasses);
    }

    @Test
    @DisplayName("P1-7: CRM module must not directly depend on Billing repositories")
    void crmShouldNotDependOnBillingRepositories() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..modules.crm..")
                .should().dependOnClassesThat()
                .resideInAPackage("..modules.billing.repository..");

        rule.check(importedClasses);
    }
}
