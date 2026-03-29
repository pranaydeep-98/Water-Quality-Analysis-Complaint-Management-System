package com.Minor.Project.repository;

import com.Minor.Project.model.ComplaintActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintActivityRepository extends JpaRepository<ComplaintActivity, Long> {
    List<ComplaintActivity> findByComplaintIdOrderByCreatedAtDesc(Long complaintId);
}
