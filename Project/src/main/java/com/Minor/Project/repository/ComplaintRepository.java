package com.Minor.Project.repository;

import com.Minor.Project.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    
    long countByArea(String area);

    boolean existsByAreaAndCreatedDateBefore(String area, LocalDate threshold);
    
    List<Complaint> findByStatus(String status);
    
    List<Complaint> findByCreatedDateBeforeAndStatusNot(LocalDate threshold, String status);

    long countBySeverity(String severity);

    @Query("SELECT c.area, COUNT(c) FROM Complaint c GROUP BY c.area")
    List<Object[]> countComplaintsByArea();

    @Query("SELECT c.createdDate, COUNT(c) FROM Complaint c GROUP BY c.createdDate ORDER BY c.createdDate DESC")
    List<Object[]> countComplaintsByDate();

    List<Complaint> findByUserId(Long userId);
}
