package com.smartims.service;

import com.smartims.dto.IssueAttachmentResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IssueAttachmentService {

    IssueAttachmentResponse upload(
            Long issueId,
            MultipartFile file
    );

    List<IssueAttachmentResponse> getAttachments(Long issueId);

    Resource download(Long attachmentId);
}
