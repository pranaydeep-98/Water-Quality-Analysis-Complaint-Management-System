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
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*")
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    public ResponseEntity<?> submitComplaint(
            @RequestBody ComplaintRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            Complaint saved = complaintService.save(request, token);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500)
              .body(Map.of("message", "Error submitting complaint: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<String> updateStatus(
            @PathVariable Long id, 
            @RequestParam String status,
            @RequestParam(required = false) String remarks) {
        complaintService.updateStatus(id, status, remarks);
        return ResponseEntity.ok("Complaint #" + id + " updated to " + status);
    }

    @PutMapping("/{id}/admin-update")
    public ResponseEntity<String> adminUpdate(@PathVariable Long id, @RequestBody Map<String, String> updates) {
        String status = updates.get("status");
        String remarks = updates.get("remarks");
        complaintService.updateStatus(id, status, remarks);
        return ResponseEntity.ok("Complaint updated successfully by admin");
    }

    @GetMapping("/metrics")
    public ResponseEntity<?> getDashboardMetrics() {
        return ResponseEntity.ok(complaintService.getDashboardMetrics());
    }
}
