package com.example.zhanfinancebackend.modules.crm.statemachine;

public record TaskTransitionResult(boolean allowed, String message) {

    public static TaskTransitionResult allow() {
        return new TaskTransitionResult(true, null);
    }

    public static TaskTransitionResult reject(String message) {
        return new TaskTransitionResult(false, message);
    }
}
