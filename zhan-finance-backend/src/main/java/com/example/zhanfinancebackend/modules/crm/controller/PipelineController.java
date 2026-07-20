package com.example.zhanfinancebackend.modules.crm.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.crm.dto.PipelineDto;
import com.example.zhanfinancebackend.modules.crm.dto.StageDto;
import com.example.zhanfinancebackend.modules.crm.entity.Pipeline;
import com.example.zhanfinancebackend.modules.crm.repository.PipelineRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/crm/pipelines")
public class PipelineController {

    private final PipelineRepository pipelineRepository;

    public PipelineController(PipelineRepository pipelineRepository) {
        this.pipelineRepository = pipelineRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
    public ApiResponse<List<PipelineDto>> getPipelines() {
        List<PipelineDto> pipelines = pipelineRepository.findAllWithStages().stream().map(p -> new PipelineDto(
                p.getId(),
                p.getName(),
                p.isDefault(),
                p.getStages().stream().map(s -> new StageDto(
                        s.getId(),
                        p.getId(),
                        s.getName(),
                        s.getOrderIndex(),
                        s.getColor(),
                        s.getType(),
                        s.isDefault(),
                        s.isPreFinal()
                )).toList()
        )).toList();
        return ApiResponse.success(pipelines);
    }
}
