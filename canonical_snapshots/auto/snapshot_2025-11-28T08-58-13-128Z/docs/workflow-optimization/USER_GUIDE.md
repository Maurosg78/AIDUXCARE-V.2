# Workflow Optimization - User Guide

## Overview

This guide explains how to use the optimized workflow system for follow-up visits.

## Workflow Selection

### Automatic Detection

The system automatically detects whether a visit is an initial evaluation or follow-up based on:
- Patient history (recent episodes)
- Chief complaint keywords
- Consultation metadata

**Confidence Levels:**
- **80%+**: Automatically uses follow-up workflow
- **60-79%**: Suggests follow-up workflow (you can confirm or override)
- **<60%**: Defaults to initial evaluation workflow

### Manual Override

You can always override the automatic detection:

1. **View Detection**: Check the workflow selector at the top of the page
2. **See Confidence**: View the confidence badge (0-100%)
3. **Override**: Click "Initial Evaluation" or "Follow-up Visit" buttons
4. **Reset**: Click "Reset to auto-detect" to return to automatic detection

## Follow-up Workflow

### What's Different

**Follow-up Workflow:**
- Skips comprehensive analysis tab
- Goes directly to SOAP generation
- Uses optimized prompts (70% fewer tokens)
- Focuses on changes since last visit

**Initial Evaluation Workflow:**
- Full analysis workflow
- Complete assessment
- Comprehensive documentation

### Efficiency Gains

When using follow-up workflow, you'll see:
- **Time Saved**: Minutes saved vs initial evaluation
- **Token Reduction**: Percentage reduction in AI processing
- **Fewer Clicks**: Reduced navigation steps

## SOAP Generation

### Optimized Mode

When follow-up workflow is active:
- **Badge**: "Optimized" badge appears in SOAP editor
- **Token Reduction**: Shows percentage reduction
- **Focus**: Emphasizes changes and progress

### Quality Maintained

Even in optimized mode:
- Clinical accuracy standards preserved
- Professional documentation quality
- EMR-ready format
- Complete audit trail

## Feedback

### Providing Feedback

After finalizing a SOAP note:
1. **Feedback Prompt**: Appears automatically after 2 seconds
2. **Rate Experience**: Click "Helpful" or "Needs improvement"
3. **Add Comments**: Optional comments field
4. **Submit**: Your feedback helps improve detection accuracy

### Why Feedback Matters

Your feedback helps:
- Improve detection accuracy
- Refine workflow optimization
- Enhance user experience
- Maintain clinical quality

## Tips for Best Results

### For Follow-ups

1. **Use Clear Language**: "Follow-up visit", "Progress check", "Return visit"
2. **Mention Previous Visit**: "Since last visit", "Since last time"
3. **Describe Changes**: "Improved", "Worse", "Same"

### For Initial Evaluations

1. **New Patient**: System will detect as initial evaluation
2. **No Recent History**: Automatically uses initial workflow
3. **Clear Indicators**: "New patient", "First visit", "Initial assessment"

## Troubleshooting

### Detection Seems Wrong

1. **Check Confidence**: Low confidence (<60%) means detection is uncertain
2. **Use Override**: Manually select correct workflow type
3. **Provide Feedback**: Help improve detection for future visits

### Workflow Not Optimized

1. **Check Detection**: Verify workflow type in selector
2. **Verify Confidence**: Should be 80%+ for automatic follow-up
3. **Manual Override**: Use manual selection if needed

### Metrics Not Showing

1. **Follow-up Only**: Metrics only show for follow-up workflows
2. **After Finalization**: Metrics appear after SOAP is finalized
3. **Check Console**: Look for workflow metrics in browser console

## Support

For questions or issues:
- **Feedback**: Use the feedback component after sessions
- **Documentation**: Check detection algorithm documentation
- **Support**: Contact AiduxCare support team

---

**Status**: ✅ User Guide Complete

**Last Updated**: November 27, 2025


