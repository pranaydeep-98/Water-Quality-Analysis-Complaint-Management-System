package com.Minor.Project.repository;

import com.Minor.Project.model.Complaint;
import com.Minor.Project.model.ComplaintStatus;
import com.Minor.Project.model.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    
    long countByLocation(String location);

    boolean existsByLocationAndCreatedAtBefore(String location, LocalDateTime threshold);
    
    List<Complaint> findByStatus(ComplaintStatus status);
    
    List<Complaint> findByCreatedAtBeforeAndStatusNot(LocalDateTime threshold, ComplaintStatus status);

    long countBySeverity(Severity severity);

    @Query("SELECT c.location, COUNT(c) FROM Complaint c GROUP BY c.location")
    List<Object[]> countComplaintsByLocation();

    @Query("SELECT DATE(c.createdAt), COUNT(c) FROM Complaint c GROUP BY DATE(c.createdAt) ORDER BY DATE(c.createdAt) DESC")
    List<Object[]> countComplaintsByDate();
}
