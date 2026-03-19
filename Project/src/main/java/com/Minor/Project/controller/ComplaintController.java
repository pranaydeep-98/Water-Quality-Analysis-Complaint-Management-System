package com.Minor.Project.controller;

import com.Minor.Project.dto.ComplaintRequest;
import com.Minor.Project.model.Complaint;
import com.Minor.Project.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    public ResponseEntity<Complaint> createComplaint(@RequestBody ComplaintRequest request) {
        return ResponseEntity.ok(complaintService.createComplaint(request));
    }

    @GetMapping
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<String> updateStatus(@PathVariable Long id, @RequestParam com.Minor.Project.model.ComplaintStatus status) {
        complaintService.updateStatus(id, status);
        return ResponseEntity.ok("Status updated successfully");
    }

    @PutMapping("/{id}/admin-update")
    public ResponseEntity<String> adminUpdate(@PathVariable Long id, @RequestBody Map<String, String> updates) {
        com.Minor.Project.model.ComplaintStatus status = updates.get("status") != null ? com.Minor.Project.model.ComplaintStatus.valueOf(updates.get("status")) : null;
        com.Minor.Project.model.Priority priority = updates.get("priority") != null ? com.Minor.Project.model.Priority.valueOf(updates.get("priority")) : null;
        com.Minor.Project.model.Severity severity = updates.get("severity") != null ? com.Minor.Project.model.Severity.valueOf(updates.get("severity")) : null;
        complaintService.adminUpdate(id, status, priority, severity);
        return ResponseEntity.ok("Complaint updated successfully by admin");
    }
}
