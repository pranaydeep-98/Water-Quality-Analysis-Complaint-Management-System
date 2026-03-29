package com.Minor.Project.repository;

import com.Minor.Project.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    
    long countByArea(String area);

    boolean existsByAreaAndCreatedDateBefore(String area, LocalDateTime threshold);
    
    List<Complaint> findByStatus(String status);
    
    List<Complaint> findByCreatedDateBeforeAndStatusNot(LocalDateTime threshold, String status);

    long countBySeverity(String severity);

    @Query("SELECT c.area, COUNT(c) FROM Complaint c GROUP BY c.area")
    List<Object[]> countComplaintsByArea();

    @Query("SELECT c.createdDate, COUNT(c) FROM Complaint c GROUP BY c.createdDate ORDER BY c.createdDate DESC")
    List<Object[]> countComplaintsByDate();

    List<Complaint> findByUserId(Long userId);

    // For user duplicate check
    List<Complaint> findByUserIdAndAreaIgnoreCaseAndIssueTypeIgnoreCase(
        Long userId, String area, String issueType
    );

    // For duplicate handling candidates
    List<Complaint> findByAreaIgnoreCaseAndIssueTypeIgnoreCaseAndCreatedDateAfter(
        String area, String issueType, LocalDateTime since
    );

    // For area duplicate count
    @Query("SELECT COUNT(c) FROM Complaint c WHERE " +
           "LOWER(c.area) = LOWER(:area) AND " +
           "LOWER(c.issueType) = LOWER(:issueType) AND " +
           "c.createdDate >= :since AND " +
           "c.status != 'Resolved'")
    long countAreaDuplicates(
        @org.springframework.data.repository.query.Param("area") String area,
        @org.springframework.data.repository.query.Param("issueType") String issueType,
        @org.springframework.data.repository.query.Param("since") LocalDateTime since
    );
    // For group scanning
    List<Complaint> findByCreatedDateAfter(LocalDateTime since);
}
