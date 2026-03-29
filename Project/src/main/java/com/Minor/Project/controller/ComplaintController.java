package com.Minor.Project.controller;

import com.Minor.Project.dto.ComplaintRequest;
import com.Minor.Project.model.Complaint;
import com.Minor.Project.model.ComplaintActivity;
import com.Minor.Project.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
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
    public ResponseEntity<List<com.Minor.Project.dto.ComplaintResponseDTO>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    @GetMapping("/user")
    public ResponseEntity<List<Complaint>> getUserComplaints(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(complaintService.getUserComplaints(token));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id, 
            @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            String remarks = request.get("remarks");
            complaintService.updateStatus(id, status, remarks);
            return ResponseEntity.ok(Map.of("message", "Complaint #" + id + " updated to " + status));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error updating status: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/admin-update")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminUpdate(@PathVariable Long id, @RequestBody Map<String, String> updates) {
        System.out.println("DEBUG: Admin update request for ID: " + id + " with map: " + updates);
        try {
            String status = updates.get("status");
            String remarks = updates.get("remarks");
            complaintService.updateStatus(id, status, remarks);
            return ResponseEntity.ok(Map.of("message", "Administrative update successful for complaint #" + id));
        } catch (Exception e) {
            System.err.println("DEBUG: Admin update failed: " + e.getMessage());
            return ResponseEntity.status(500)
                .body(Map.of("message", "Administrative update failed: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/activities")
    public ResponseEntity<List<ComplaintActivity>> getActivities(@PathVariable Long id) {
        return ResponseEntity.ok(complaintService.getComplaintActivities(id));
    }

    @GetMapping("/metrics")
    public ResponseEntity<?> getDashboardMetrics(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(complaintService.getDashboardMetrics(token));
    }
}
