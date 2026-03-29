package com.Minor.Project.controller;

import com.Minor.Project.model.Complaint;
import com.Minor.Project.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*")
public class UserController {

    private final ComplaintService complaintService;

    @GetMapping("/complaints")
    public ResponseEntity<List<Complaint>> getUserComplaints(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(complaintService.getUserComplaints(token));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getUserStats(@RequestHeader("Authorization") String token) {
        List<Complaint> myComplaints = complaintService.getUserComplaints(token);
        
        long resolved = myComplaints.stream().filter(c -> "Resolved".equalsIgnoreCase(c.getStatus())).count();
        long pending = myComplaints.size() - resolved;

        return ResponseEntity.ok(Map.of(
            "total", myComplaints.size(),
            "resolved", resolved,
            "pending", pending
        ));
    }
}
